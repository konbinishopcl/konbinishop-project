/* eslint-disable @next/next/no-img-element */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <div className="brand">
      <img
        src="/konbini-logo.svg"
        alt="Konbini"
        style={{ height: size, width: "auto", display: "block" }}
      />
    </div>
  );
}
