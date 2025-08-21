import ProtectedRoute from '../../../components/ProtectedRoute';

export default function MyBetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
