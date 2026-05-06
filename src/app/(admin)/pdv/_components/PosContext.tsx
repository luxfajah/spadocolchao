"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type CustomerType = { id: string, fullName: string, document?: string } | null;
export type SaleItemType = {
  id: string;
  productServiceId: string;
  name: string;
  type: string;
  originalPrice: number;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalAmount: number;
  details?: any;
};

export type PosContextType = {
  initialData: any;
  customer: CustomerType;
  setCustomer: (c: CustomerType) => void;
  sellerId: string | null;
  setSellerId: (s: string | null) => void;
  leadSourceId: string | null;
  setLeadSourceId: (l: string | null) => void;
  items: SaleItemType[];
  payments: any[];
  setPayments: (p: any[]) => void;
  addItem: (item: SaleItemType) => void;
  removeItem: (id: string) => void;
  updateItemPrice: (id: string, newPrice: number) => void;
  subtotal: number;
  total: number;
  globalDiscount: number;
  setGlobalDiscount: (d: number) => void;
  leadSourceDetail: string;
  setLeadSourceDetail: (s: string) => void;
  campaignName: string;
  setCampaignName: (s: string) => void;
  referralName: string;
  setReferralName: (s: string) => void;
  externalSellerName: string;
  setExternalSellerName: (s: string) => void;
  resetSale: () => void;
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children, initialData }: { children: ReactNode, initialData: any }) {
  const [customer, setCustomer] = useState<CustomerType>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [leadSourceId, setLeadSourceId] = useState<string | null>(null);
  const [leadSourceDetail, setLeadSourceDetail] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [referralName, setReferralName] = useState("");
  const [externalSellerName, setExternalSellerName] = useState("");
  const [items, setItems] = useState<SaleItemType[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);

  // RECUPERAR RASCUNHO (DRAFT) AO VOLTAR DO CADASTRO
  useEffect(() => {
    const draft = localStorage.getItem('pdv_draft');
    if (draft) {
      try {
        const { items: savedItems, sellerId: savedSeller, leadSourceId: savedSource, globalDiscount: savedDiscount } = JSON.parse(draft);
        if (savedItems) setItems(savedItems);
        if (savedSeller) setSellerId(savedSeller);
        if (savedSource) setLeadSourceId(savedSource);
        if (savedDiscount) setGlobalDiscount(savedDiscount);
        
        // Se houver um novo cliente cadastrado vindo da URL, ele será priorizado no PosCustomer
        localStorage.removeItem('pdv_draft'); 
      } catch (e) {
        console.error("Erro ao recuperar rascunho do PDV");
      }
    }
  }, []);

  const addItem = (item: SaleItemType) => setItems((prev) => [...prev, item]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i: SaleItemType) => i.id !== id));
  const updateItemPrice = (id: string, newPrice: number) => {
    setItems((prev: SaleItemType[]) => prev.map((i: SaleItemType) => i.id === id ? { ...i, unitPrice: newPrice, totalAmount: newPrice * i.quantity } : i));
  };

  const resetSale = () => {
    setCustomer(null);
    setSellerId(null);
    setLeadSourceId(null);
    setLeadSourceDetail("");
    setCampaignName("");
    setReferralName("");
    setExternalSellerName("");
    setItems([]);
    setGlobalDiscount(0);
    setPayments([]);
    localStorage.removeItem('pdv_draft');
  };

  const subtotal = items.reduce((acc, item) => acc + item.totalAmount, 0);
  const total = subtotal - globalDiscount;

  return (
    <PosContext.Provider value={{
      initialData,
      customer, setCustomer,
      sellerId, setSellerId,
      leadSourceId, setLeadSourceId,
      items, addItem, removeItem, updateItemPrice,
      subtotal, total, globalDiscount, setGlobalDiscount,
      payments, setPayments,
      leadSourceDetail, setLeadSourceDetail,
      campaignName, setCampaignName,
      referralName, setReferralName,
      externalSellerName, setExternalSellerName,
      resetSale
    }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error("usePos must be used within a PosProvider");
  return context;
}
