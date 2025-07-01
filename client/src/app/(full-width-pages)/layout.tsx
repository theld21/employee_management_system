import AppWrapper from "@/components/common/AppWrapper";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppWrapper>
      <div>{children}</div>
    </AppWrapper>
  );
}
