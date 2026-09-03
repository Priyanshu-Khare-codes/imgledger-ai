// Shared TypeScript types mirroring backend Pydantic models

export interface FaceDetectionResult {
  detected: boolean;
  face_count: number;
  embedding?: number[];
  error?: string;
}

export interface Candidate {
  id: number;
  title: string;
  source: string;
  url: string;
  thumbnail: string;
  image_url: string;
  description: string;
  local_path?: string;
  downloaded: boolean;
}

export interface VerifiedCandidate {
  candidate: Candidate;
  similarity: number;
  face_count: number;
  status: 'MATCH' | 'REJECTED' | 'NO_FACE' | 'NO_IMAGE' | 'LOAD_ERROR';
}

export interface BlockchainRecord {
  record_id: string;
  block_index: number;
  timestamp: string;
  previous_hash: string;
  data_hash: string;
  block_hash: string;
  payload: Record<string, unknown>;
}

export interface VerificationResult {
  record_id: string;
  stored_hash: string;
  current_hash: string;
  verified: boolean;
}

export interface PipelineResult {
  // Face
  face_detected: boolean;
  face_count: number;
  // Search
  search_results_count: number;
  candidates_processed: number;
  // Match
  match_found: boolean;
  match?: VerifiedCandidate;
  // Blockchain
  blockchain_record?: BlockchainRecord;
  verification?: VerificationResult;
  // Error
  error?: string;
}

export interface SearchResponse {
  success: boolean;
  pipeline: PipelineResult;
  message: string;
}

export interface RecordResponse {
  success: boolean;
  record?: BlockchainRecord;
  message: string;
}

export interface VerifyResponse {
  success: boolean;
  verification?: VerificationResult;
  message: string;
}

// Pipeline step status
export type StepStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

export interface PipelineStep {
  id: number;
  label: string;
  detail?: string;
  status: StepStatus;
}
