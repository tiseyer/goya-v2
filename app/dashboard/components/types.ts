import type { CreditTotals } from '@/lib/credits'
import type { ProfileCompletionResult } from '@/lib/dashboard/profileCompletion'
import type {
  TeacherRow,
  EventRow,
  CourseRow,
  AcceptedConnection,
  FacultyRow,
  InProgressCourseRow,
} from '@/lib/dashboard/queries'

export interface DashboardProfile {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  role: string | null
  bio: string | null
  location: string | null
  website: string | null
  instagram: string | null
  youtube: string | null
  teaching_styles: string[] | null
  principal_trainer_school_id: string | null
  member_type: string | null
}

export interface DashboardProps {
  profile: DashboardProfile
  teachers: TeacherRow[]
  events: EventRow[]
  courses: CourseRow[]
  connections: AcceptedConnection[]
  creditTotals: CreditTotals
  completion: ProfileCompletionResult
  inProgressCourses: InProgressCourseRow[]
}

export interface TeacherProps extends DashboardProps {
  isSchoolOwner: boolean
  school: { id: string } | null
}

export interface SchoolProps extends DashboardProps {
  school: {
    id: string
    name: string
    slug: string | null
    bio: string | null
    logo_url: string | null
    status: string | null
  }
  faculty: FacultyRow[]
  isSchoolOwner: boolean
}
