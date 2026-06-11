const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Seed data ──────────────────────────────────────────────────────────────

const incidents = [
  { id: 1, title: 'Perte de signal site Marseille Nord', description: 'Perte totale du signal 4G sur le site MRS-N01 depuis 14h. Les abonn\u00c3\u00a9s de la zone ne peuvent plus passer d\'appels.', status: 'open', siteCode: 'MRS-N01', latitude: '43.3096', longitude: '5.3698', createdAt: '2026-04-24T14:00:00Z', assignedTo: null, commentCount: 2 },
  { id: 2, title: 'D\u00c3\u00a9gradation KPIs Lyon Part-Dieu', description: 'D\u00c3\u00a9gradation importante des KPIs radio depuis ce matin. Le taux de drop call est pass\u00c3\u00a9 de 0.5% \u00c3\u00a0 4.2%.', status: 'inProgress', siteCode: 'LYN-PD03', latitude: '45.7602', longitude: '4.8595', createdAt: '2026-04-24T08:30:00Z', assignedTo: 'tech1@company.com', commentCount: 5 },
  { id: 3, title: 'Coupure fibre backbone Paris-Est', description: 'Coupure de la fibre backbone sur le tron\u00c3\u00a7on Paris-Est. Impact sur 12 sites relay\u00c3\u00a9s.', status: 'inProgress', siteCode: 'PAR-E07', latitude: '48.8566', longitude: '2.3522', createdAt: '2026-04-23T22:15:00Z', assignedTo: 'tech2@company.com', commentCount: 8 },
  { id: 4, title: 'Alarme temp\u00c3\u00a9rature shelter Toulouse', description: 'Alarme haute temp\u00c3\u00a9rature dans le shelter du site TLS-S02. Climatisation en panne.', status: 'open', siteCode: 'TLS-S02', latitude: '43.6047', longitude: '1.4442', createdAt: '2026-04-24T11:00:00Z', assignedTo: null, commentCount: 0 },
  { id: 5, title: 'Saturation bande passante Nantes', description: 'Saturation r\u00c3\u00a9currente de la bande passante sur NTS-C01 aux heures de pointe.', status: 'resolved', siteCode: 'NTS-C01', latitude: '47.2184', longitude: '-1.5536', createdAt: '2026-04-22T09:00:00Z', assignedTo: 'tech1@company.com', commentCount: 12 },
  { id: 6, title: 'Panne alimentation Bordeaux', description: 'Panne de l\'alimentation principale sur BDX-A04. Le site tourne sur batterie de secours, autonomie estim\u00c3\u00a9e 4h.', status: 'open', siteCode: 'BDX-A04', latitude: '44.8378', longitude: '-0.5792', createdAt: '2026-04-24T16:30:00Z', assignedTo: null, commentCount: 1 },
  { id: 7, title: 'Interf\u00c3\u00a9rence radio Strasbourg', description: 'Interf\u00c3\u00a9rences d\u00c3\u00a9tect\u00c3\u00a9es sur la bande 2600MHz du site STR-R02. Source non identifi\u00c3\u00a9e.', status: 'inProgress', siteCode: 'STR-R02', latitude: '48.5734', longitude: '7.7521', createdAt: '2026-04-23T15:45:00Z', assignedTo: 'tech3@company.com', commentCount: 3 },
  { id: 8, title: 'Mise \u00c3\u00a0 jour firmware \u00c3\u00a9chou\u00c3\u00a9e Lille', description: 'La mise \u00c3\u00a0 jour firmware v3.2.1 a \u00c3\u00a9chou\u00c3\u00a9 sur l\'\u00c3\u00a9quipement principal de LIL-N05. Rollback effectu\u00c3\u00a9.', status: 'resolved', siteCode: 'LIL-N05', latitude: '50.6292', longitude: '3.0573', createdAt: '2026-04-21T10:00:00Z', assignedTo: 'tech2@company.com', commentCount: 6 },
  { id: 9, title: 'Probl\u00c3\u00a8me handover Nice-Monaco', description: 'Probl\u00c3\u00a8me de handover entre les sites NCE-M01 et MCO-01. Les appels sont coup\u00c3\u00a9s lors du passage de fronti\u00c3\u00a8re.', status: 'open', siteCode: 'NCE-M01', latitude: '43.7102', longitude: '7.2620', createdAt: '2026-04-24T09:20:00Z', assignedTo: null, commentCount: 0 },
  { id: 10, title: 'Congestion 5G Rennes Centre', description: 'Congestion massive sur le n\u00c5\u0093ud 5G de RNS-C01 li\u00c3\u00a9e \u00c3\u00a0 un \u00c3\u00a9v\u00c3\u00a9nement sportif.', status: 'resolved', siteCode: 'RNS-C01', latitude: '48.1173', longitude: '-1.6778', createdAt: '2026-04-20T18:00:00Z', assignedTo: 'tech1@company.com', commentCount: 15 },
  { id: 11, title: 'Perte couverture indoor Montpellier', description: 'Les capteurs indoor du centre commercial MPL-IC02 ne r\u00c3\u00a9pondent plus depuis hier soir.', status: 'open', siteCode: 'MPL-IC02', latitude: '43.6108', longitude: '3.8767', createdAt: '2026-04-24T07:00:00Z', assignedTo: null, commentCount: 1 },
  { id: 12, title: 'D\u00c3\u00a9faut antenne secteur 2 Grenoble', description: 'Le secteur 2 de GRN-A01 pr\u00c3\u00a9sente un VSWR anormal. Suspicion de d\u00c3\u00a9faut c\u00c3\u00a2ble coaxial.', status: 'inProgress', siteCode: 'GRN-A01', latitude: '45.1885', longitude: '5.7245', createdAt: '2026-04-23T13:00:00Z', assignedTo: 'tech3@company.com', commentCount: 4 },
];

const comments = {
  1: [
    { id: 101, author: 'tech1@company.com', message: 'Je prends en charge, d\u00c3\u00a9placement pr\u00c3\u00a9vu \u00c3\u00a0 15h.', createdAt: '2026-04-24T14:20:00Z' },
    { id: 102, author: 'supervisor@company.com', message: 'Priorit\u00c3\u00a9 haute, client VIP impact\u00c3\u00a9.', createdAt: '2026-04-24T14:10:00Z' },
  ],
  2: [
    { id: 201, author: 'tech1@company.com', message: 'Analyse en cours. Le probl\u00c3\u00a8me semble li\u00c3\u00a9 au paramétrage du tilt.', createdAt: '2026-04-24T09:00:00Z' },
    { id: 202, author: 'tech2@company.com', message: 'Je confirme, le tilt a \u00c3\u00a9t\u00c3\u00a9 modifi\u00c3\u00a9 lors de la derni\u00c3\u00a8re intervention.', createdAt: '2026-04-24T09:30:00Z' },
    { id: 203, author: 'tech1@company.com', message: 'Correction appliqu\u00c3\u00a9e, monitoring en cours.', createdAt: '2026-04-24T10:15:00Z' },
    { id: 204, author: 'supervisor@company.com', message: 'Les KPIs remontent, on garde sous surveillance 24h.', createdAt: '2026-04-24T11:00:00Z' },
    { id: 205, author: 'tech1@company.com', message: 'RAS depuis 2h, je passe en surveillance passive.', createdAt: '2026-04-24T13:00:00Z' },
  ],
  3: [
    { id: 301, author: 'tech2@company.com', message: 'Fibre coup\u00c3\u00a9e identifi\u00c3\u00a9e sur le tron\u00c3\u00a7on km 42.', createdAt: '2026-04-23T22:30:00Z' },
    { id: 302, author: 'tech2@company.com', message: '\u00c3\u0089quipe terrain envoy\u00c3\u00a9e.', createdAt: '2026-04-23T23:00:00Z' },
    { id: 303, author: 'tech3@company.com', message: 'Reroutage en cours sur le backup.', createdAt: '2026-04-23T23:15:00Z' },
    { id: 304, author: 'supervisor@company.com', message: 'ETA r\u00c3\u00a9paration ?', createdAt: '2026-04-23T23:30:00Z' },
    { id: 305, author: 'tech2@company.com', message: 'Estim\u00c3\u00a9 4-6h pour la soudure.', createdAt: '2026-04-23T23:45:00Z' },
    { id: 306, author: 'tech2@company.com', message: 'Soudure termin\u00c3\u00a9e, tests en cours.', createdAt: '2026-04-24T04:00:00Z' },
    { id: 307, author: 'tech2@company.com', message: 'Tests OK, att\u00c3\u00a9nuation dans les normes.', createdAt: '2026-04-24T04:30:00Z' },
    { id: 308, author: 'supervisor@company.com', message: 'Parfait, les 12 sites sont remontés.', createdAt: '2026-04-24T05:00:00Z' },
  ],
  6: [
    { id: 601, author: 'tech3@company.com', message: 'Électricien contact\u00c3\u00a9, intervention pr\u00c3\u00a9vue demain matin.', createdAt: '2026-04-24T17:00:00Z' },
  ],
  7: [
    { id: 701, author: 'tech3@company.com', message: 'Scan fr\u00c3\u00a9quentiel lanc\u00c3\u00a9.', createdAt: '2026-04-23T16:00:00Z' },
    { id: 702, author: 'tech3@company.com', message: 'Source identifi\u00c3\u00a9e : antenne relais priv\u00c3\u00a9e non autoris\u00c3\u00a9e.', createdAt: '2026-04-23T17:30:00Z' },
    { id: 703, author: 'supervisor@company.com', message: 'ANFR notifi\u00c3\u00a9e.', createdAt: '2026-04-23T18:00:00Z' },
  ],
  11: [
    { id: 1101, author: 'tech1@company.com', message: 'V\u00c3\u00a9rification pr\u00c3\u00a9vue ce matin.', createdAt: '2026-04-24T08:00:00Z' },
  ],
  12: [
    { id: 1201, author: 'tech3@company.com', message: 'VSWR mesur\u00c3\u00a9 \u00c3\u00a0 2.8, confirm\u00c3\u00a9 anormal.', createdAt: '2026-04-23T14:00:00Z' },
    { id: 1202, author: 'tech3@company.com', message: 'D\u00c3\u00a9faut localis\u00c3\u00a9 au connecteur N en bas de m\u00c3\u00a2t.', createdAt: '2026-04-23T15:00:00Z' },
    { id: 1203, author: 'tech3@company.com', message: 'Connecteur remplac\u00c3\u00a9, VSWR redescendu \u00c3\u00a0 1.2.', createdAt: '2026-04-23T16:30:00Z' },
    { id: 1204, author: 'supervisor@company.com', message: 'Monitoring 48h avant cl\u00c3\u00b4ture.', createdAt: '2026-04-23T17:00:00Z' },
  ],
};

// ─── Mock session (simulates authenticated user) ────────────────────────────

function getSessionEmail(req) {
  // In real app this comes from auth middleware / JWT.
  // Here we simulate it via a header the BFF can set.
  return req.headers['x-user-email'] || 'candidate@company.com';
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /v1/incidents — paginated + filterable
app.get('/v1/incidents', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const siteCode = req.query.siteCode;

  let filtered = [...incidents];

  if (status) {
    filtered = filtered.filter(i => i.status === status);
  }
  if (siteCode) {
    filtered = filtered.filter(i =>
      i.siteCode.toLowerCase().includes(siteCode.toLowerCase())
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  res.json({
    data,
    total,
    currentPage: page,
    filteredCount: total,
  });
});

// GET /v1/incidents/:id — detail
app.get('/v1/incidents/:id', (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }
  res.json({ data: incident });
});

// PATCH /v1/incidents/:id — update
app.patch('/v1/incidents/:id', (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  const { status } = req.body;
  if (status && !['open', 'inProgress', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // Business rule: a resolved incident cannot be reopened directly to "open".
  // It must transition through "inProgress" first (forces a triage step).
  // This rule lives server-side — the client must not be the source of truth.
  const ALLOWED_TRANSITIONS = {
    open: ['inProgress', 'resolved'],
    inProgress: ['open', 'resolved'],
    resolved: ['inProgress'],
  };

  if (status && status !== incident.status) {
    if (!ALLOWED_TRANSITIONS[incident.status].includes(status)) {
      return res.status(409).json({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Transition non autorisée : ${incident.status} → ${status}. Un incident résolu doit d'abord repasser par "inProgress".`,
      });
    }
  }

  if (status) incident.status = status;
  if (req.body.assignedTo !== undefined) incident.assignedTo = req.body.assignedTo;

  res.json({ data: incident });
});

// GET /v1/incidents/:id/comments — paginated
app.get('/v1/incidents/:id/comments', (req, res) => {
  const id = parseInt(req.params.id);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const all = comments[id] || [];
  const total = all.length;
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);

  res.json({
    data,
    total,
    currentPage: page,
    filteredCount: total,
  });
});

// POST /v1/incidents/:id/comments — create
app.post('/v1/incidents/:id/comments', (req, res) => {
  const id = parseInt(req.params.id);
  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  const { author, message } = req.body;
  if (!author || !message) {
    return res.status(400).json({ message: 'author and message are required' });
  }

  if (!comments[id]) comments[id] = [];

  const newComment = {
    id: Date.now(),
    author,
    message,
    createdAt: new Date().toISOString(),
  };

  comments[id].push(newComment);
  incident.commentCount = comments[id].length;

  res.status(201).json({ data: newComment });
});

// ─── Start ──────────────────────────────────────────────────────────────────

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock backend running on http://localhost:${PORT}`);
  console.log(`  GET  http://localhost:${PORT}/v1/incidents`);
  console.log(`  GET  http://localhost:${PORT}/v1/incidents/:id`);
  console.log(`  PATCH http://localhost:${PORT}/v1/incidents/:id`);
  console.log(`  GET  http://localhost:${PORT}/v1/incidents/:id/comments`);
  console.log(`  POST http://localhost:${PORT}/v1/incidents/:id/comments`);
});
