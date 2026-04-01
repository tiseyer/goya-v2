import CourseForm from '../components/CourseForm';
import { fetchCategories } from '../category-actions';

export default async function NewCoursePage() {
  const { data: categories } = await fetchCategories();
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Add New Course</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Create a new course for the GOYA Academy.</p>
      </div>
      <CourseForm categories={categories} />
    </div>
  );
}
