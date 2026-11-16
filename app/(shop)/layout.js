import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";

// Layout halaman publik toko (konsumen).
export default function ShopLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ShopHeader />
      <div className="min-h-0 flex-1">{children}</div>
      <ShopFooter />
    </div>
  );
}
