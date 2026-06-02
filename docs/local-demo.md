# Local Demo

```bash
docker compose up --build
./scripts/create-kind-cluster.sh
./scripts/install-argocd.sh
./scripts/install-gatekeeper.sh
```

If `docker` is not available, run the portal natively:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The backend seeds three demo workloads on first startup so Mission Control has real data immediately.

Suggested local flow:

1. Review the topology dashboard.
2. Click `Advance demo` to mutate backend state.
3. Create a workload.
4. Validate policies.
5. Deploy locally when kind is available.
6. Trigger drift.
7. Generate a cost report.
