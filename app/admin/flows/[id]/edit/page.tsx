import { redirect } from 'next/navigation';
import { getFlowWithSteps } from '@/lib/flows/flow-service';
import FlowEditorShell from '../../components/editor/FlowEditorShell';

export default async function FlowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: flow, error } = await getFlowWithSteps(id);

  if (error || !flow) {
    redirect('/admin/flows');
  }

  return <FlowEditorShell initialFlow={flow} />;
}
