// Spec: specs/hospital-clinic-map-search/spec.md — API contracts
// Task: specs/hospital-clinic-map-search/tasks.md — Task 4, 5

export interface HospitalSearchParams {
  lat: number;
  lng: number;
  radius?: number;       // meters, default 3000, max 50000
  departments?: string;  // comma-separated department IDs
  sort?: 'distance' | 'next_available';
  limit?: number;        // default 50, max 200
  offset?: number;       // default 0
}

export interface HospitalResult {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  distance_meters: number;
  location: { lat: number; lng: number };
  type: string;
  website_url: string | null;
  registration_url: string | null;
  data_source: string;
  departments: DepartmentInfo[];
  next_available_session: NextAvailableSession | null;
  last_updated_at: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  category: string;
}

export interface NextAvailableSession {
  date: string;
  session: string;
  department: string;
  doctor_name: string | null;
}

export interface HospitalSearchResponse {
  total: number;
  results: HospitalResult[];
}

export interface DepartmentGroup {
  category: string;
  category_label: string;
  items: DepartmentInfo[];
}

export interface DepartmentsResponse {
  departments: DepartmentGroup[];
}

export interface ScheduleSession {
  session: string;
  session_label: string;
  department: DepartmentInfo;
  doctor: { id: string; name: string } | null;
  is_available: boolean | null;
  registration_url: string | null;
}

export interface DaySchedule {
  date: string;
  day_of_week: number;
  sessions: ScheduleSession[];
}

export interface ConfidenceInfo {
  level: 'high' | 'medium' | 'low';
  label: string;
  description: string;
}

export interface HospitalScheduleResponse {
  hospital_id: string;
  hospital_name: string;
  data_source: string;
  last_updated_at: string;
  confidence: ConfidenceInfo;
  schedules: DaySchedule[];
}

export interface CrawlLogEntry {
  id: string;
  hospital_name: string | null;
  source: string;
  status: string;
  records_updated: number | null;
  error_message: string | null;
  completed_at: string | null;
}

export interface CrawlStatusResponse {
  summary: {
    total_hospitals: number;
    hospitals_with_schedules: number;
    coverage_rate: number;
    last_nhi_import: string | null;
    last_crawl_run: string | null;
  };
  recent_crawl_logs: CrawlLogEntry[];
}
