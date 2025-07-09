// app/(public)/book/[clerkUserId]/[eventId]/debug.tsx
export default function DebugPage({ params }: { params: any }) {
  return (
    <pre className="bg-gray-100 p-4">{JSON.stringify(params, null, 2)}</pre>
  );
}
