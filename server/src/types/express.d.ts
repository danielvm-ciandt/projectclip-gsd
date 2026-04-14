interface Actor {
  type: "none" | "board" | "agent";
  source: "none" | "local_implicit" | "session" | "board_key" | "agent_jwt" | "agent_key";
  userId?: string;
  agentId?: string;
  companyId?: string;
  companyIds?: string[];
  isInstanceAdmin?: boolean;
  keyId?: string;
  runId?: string;
}

declare namespace Express {
  interface Request {
    actor: Actor;
  }
}
