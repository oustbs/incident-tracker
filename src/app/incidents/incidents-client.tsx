'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, MessageSquare, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// --------------- Types ---------------

type Incident = {
  id: number;
  title: string;
  description?: string;
  status: string;
  siteCode: string;
  createdAt: string;
  assignedTo: string | null;
  commentCount?: number;
  latitude?: string;
  longitude?: string;
};

type Comment = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
};

type PaginatedComments = {
  data: Comment[];
  total: number;
  currentPage: number;
  filteredCount: number;
};

// --------------- API helpers (all via BFF) ---------------

async function fetchIncidents(status?: string, siteCode?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (status && status !== 'all') params.set('status', status);
  if (siteCode) params.set('siteCode', siteCode);

  const res = await fetch(`/api/incidents?${params}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

async function updateIncidentStatus(id: number, status: string) {
  const res = await fetch(`/api/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.message || 'Failed to update status');
  }
  return res.json();
}

async function fetchComments(id: number, page = 1, limit = 5): Promise<PaginatedComments> {
  // Using the BFF route instead of hitting localhost:4000 directly
  const res = await fetch(`/api/incidents/${id}/comments?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

async function postComment(id: number, author: string, message: string) {
  const res = await fetch(`/api/incidents/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, message }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.message || 'Failed to post comment');
  }
  return res.json();
}

// --------------- Main Component ---------------

const COMMENTS_PER_PAGE = 5;
// Auto-refresh interval for the incidents list (silent background poll)
const AUTO_REFRESH_INTERVAL_MS = 10_000;

export default function IncidentsClient() {
  const queryClient = useQueryClient();

  // List filters / pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Comments pagination state (local to the open modal)
  const [commentsPage, setCommentsPage] = useState(1);

  // New comment text
  const [newComment, setNewComment] = useState('');

  // --------------- Query: incidents list ---------------
  // keepPreviousData → no flash when page/filter changes (shows stale data until new arrives)
  // refetchInterval → silent background refresh every 10s
  // The combination ensures:
  //   - User-triggered actions (filter, paginate) show loading state because the queryKey changes
  //   - Background polls are silent because the queryKey stays the same
  const {
    data: listData,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['incidents', statusFilter, searchQuery, page],
    queryFn: () => fetchIncidents(statusFilter, searchQuery, page),
    placeholderData: keepPreviousData,   // silent pagination / filter transitions
    refetchInterval: AUTO_REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,  // pause refresh when tab is hidden
  });

  // --------------- Query: comments (paginated) ---------------
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isFetching: commentsFetching,
  } = useQuery({
    queryKey: ['comments', selectedIncident?.id, commentsPage],
    queryFn: () => fetchComments(selectedIncident!.id, commentsPage, COMMENTS_PER_PAGE),
    enabled: !!selectedIncident,
    placeholderData: keepPreviousData,  // no flash between comment pages
  });

  const comments: Comment[] = commentsData?.data || [];
  const commentsTotal: number = commentsData?.total || 0;
  const commentsTotalPages = Math.ceil(commentsTotal / COMMENTS_PER_PAGE);

  // --------------- Mutation: update status ---------------
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateIncidentStatus(id, status),
    onSuccess: (_, { status }) => {
      // Refresh both the list and the open incident detail
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success(`Status updated to "${status}"`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  // --------------- Mutation: post comment ---------------
  const commentMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      postComment(id, 'candidate@company.com', message),
    onSuccess: () => {
      setNewComment('');
      // Jump to last page to show the new comment, or re-fetch current page
      queryClient.invalidateQueries({ queryKey: ['comments', selectedIncident?.id] });
      // Also update the commentCount badge in the list
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Comment added successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add comment');
    },
  });

  // --------------- Handlers ---------------

  const handleOpenDetail = (incident: Incident) => {
    setSelectedIncident(incident);
    setCommentsPage(1);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedIncident(null);
      setCommentsPage(1);
      setNewComment('');
    }
  };

  const handleStatusChange = (incidentId: number, newStatus: string) => {
    statusMutation.mutate({ id: incidentId, status: newStatus });
  };

  const handleSendComment = () => {
    if (!newComment.trim() || !selectedIncident) return;
    commentMutation.mutate({ id: selectedIncident.id, message: newComment });
  };

  const incidents: Incident[] = listData?.data || [];
  const total: number = listData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // isLoading → first load (no data yet) → show skeletons
  // isFetching && !isLoading → background poll → silent (no flash)
  const showSkeletons = isLoading;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Incidents</h1>
        {/* Subtle indicator for background refresh — does NOT block the UI */}
        {isFetching && !isLoading && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Refreshing…
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (v) {
              setStatusFilter(v);
              setPage(1); // reset to page 1 → new queryKey → shows loading (intentional)
            }
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="inProgress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search site code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      {showSkeletons && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="size-4" />
          Failed to load incidents.
        </div>
      )}

      {!showSkeletons && !isError && (
        <div className="space-y-2">
          {incidents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No incidents found.</p>
          ) : (
            incidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => handleOpenDetail(incident)}
                className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{incident.title}</span>
                    <StatusBadge status={incident.status} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{incident.siteCode}</span>
                    <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                    {incident.assignedTo && <span>{incident.assignedTo}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="size-4" />
                  <span className="text-sm">{incident.commentCount ?? 0}</span>
                </div>
              </div>
            ))
          )}

          {/* List pagination */}
          {total > 10 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Incident detail modal */}
      <Dialog open={modalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle>{selectedIncident.title}</DialogTitle>
                  <StatusBadge status={selectedIncident.status} />
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Incident info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Site:</span>{' '}
                    {selectedIncident.siteCode}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    {new Date(selectedIncident.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned:</span>{' '}
                    {selectedIncident.assignedTo || 'Unassigned'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Select
                      value={selectedIncident.status}
                      onValueChange={(v) => {
                        if (v) {
                          // Optimistically update local state so the select reflects the change immediately
                          setSelectedIncident((prev) => prev ? { ...prev, status: v } : prev);
                          handleStatusChange(selectedIncident.id, v);
                        }
                      }}
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-36 h-8 inline-flex">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="inProgress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedIncident.description && (
                  <div>
                    <h3 className="font-medium mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedIncident.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Comments section */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    Comments ({commentsTotal})
                    {commentsFetching && !commentsLoading && (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </h3>

                  {commentsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-3/4" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="rounded-md border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                      ))}

                      {/* Comments pagination */}
                      {commentsTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={commentsPage === 1 || commentsFetching}
                            onClick={() => setCommentsPage((p) => p - 1)}
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {commentsPage} / {commentsTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={commentsPage >= commentsTotalPages || commentsFetching}
                            onClick={() => setCommentsPage((p) => p + 1)}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="space-y-2 pt-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || commentMutation.isPending}
                      >
                        {commentMutation.isPending && (
                          <Loader2 className="size-3 mr-1.5 animate-spin" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --------------- StatusBadge ---------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    inProgress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
  };

  return (
    <Badge variant="secondary" className={colors[status] || 'bg-gray-100 text-gray-700'}>
      {status.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}
    </Badge>
  );
}
