import { LayoutContent } from '@/components/layout/layout-content';

export default function PublicLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <LayoutContent modal={modal}>
      {children}
    </LayoutContent>
  );
}
