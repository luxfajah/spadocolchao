"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type CustomerType = { id: string, fullName: string, document?: string } | null;
export type SaleItemType = {
  id: string;
  productServiceId: string;
  name: string;
  type: string;
  originalPrice: number;
  minimumPrice?: number;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalAmount: number;
  priceJustification?: string;
  allowPriceChangeInPDV?: boolean;
  requirePriceChangeJustification?: boolean;
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
  updateItemPrice: (id: string, newPrice: number, justification?: string) => void;
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
  currentStep: number;
  setCurrentStep: (s: number) => void;
  pickupDate: string;
  setPickupDate: (d: string) => void;
  pickupTime: string;
  setPickupTime: (t: string) => void;
  deliveryDate: string;
  setDeliveryDate: (d: string) => void;
  deliveryTime: string;
  setDeliveryTime: (t: string) => void;
  recipientName: string;
  setRecipientName: (r: string) => void;
  recipientPhone: string;
  setRecipientPhone: (p: string) => void;
  logisticsNotes: string;
  setLogisticsNotes: (n: string) => void;
  scheduleMode: "both" | "delivery" | "pickup";
  setScheduleMode: (m: "both" | "delivery" | "pickup") => void;
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children, initialData }: { children: ReactNode, initialData: any }) {
  const [customer, setCustomer] = useState<CustomerType>(null);
  const [sellerId, setSellerId] = useState<string | null>(
    initialData?.currentSellerId || null
  );
  const [leadSourceId, setLeadSourceId] = useState<string | null>(null);
  const [leadSourceDetail, setLeadSourceDetail] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [referralName, setReferralName] = useState("");
  const [externalSellerName, setExternalSellerName] = useState("");
  const [items, setItems] = useState<SaleItemType[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // AGENDAMENTO DE LOGÍSTICA (RETIRADA E ENTREGA)
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [logisticsNotes, setLogisticsNotes] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"both" | "delivery" | "pickup">("delivery");

  // RECUPERAR RASCUNHO (DRAFT) AO VOLTAR DO CADASTRO
  useEffect(() => {
    const draft = localStorage.getItem('pdv_draft');
    if (draft) {
      try {
        const { items: savedItems, sellerId: savedSeller, leadSourceId: savedSource, globalDiscount: savedDiscount } = JSON.parse(draft);
        if (savedItems) setItems(savedItems);
        // Só sobrepõe o seller do rascunho se não houver seller do usuário logado
        if (savedSeller && !initialData?.currentSellerId) setSellerId(savedSeller);
        if (savedSource) setLeadSourceId(savedSource);
        if (savedDiscount) setGlobalDiscount(savedDiscount);
        
        localStorage.removeItem('pdv_draft'); 
      } catch (e) {
        console.error("Erro ao recuperar rascunho do PDV");
      }
    }

    // CHECK FOR CUSTOMER REDIRECTED FROM VISITS
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCustomerId = urlParams.get("customerId");
      const urlCustomerName = urlParams.get("customerName");
      if (urlCustomerId && urlCustomerName) {
        setCustomer({
          id: urlCustomerId,
          fullName: decodeURIComponent(urlCustomerName)
        });
        
        // Clean URL params from history
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [initialData]);


  const addItem = (item: SaleItemType) => setItems((prev) => [...prev, item]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i: SaleItemType) => i.id !== id));
  const updateItemPrice = (id: string, newPrice: number, justification?: string) => {
    setItems((prev: SaleItemType[]) => prev.map((i: SaleItemType) => {
      if (i.id !== id) return i;
      const discount = Math.max(0, (i.originalPrice - newPrice) * i.quantity);
      return {
        ...i,
        unitPrice: newPrice,
        totalAmount: newPrice * i.quantity,
        discountAmount: discount,
        priceJustification: justification || i.priceJustification
      };
    }));
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
    setCurrentStep(1);
    setPickupDate("");
    setPickupTime("");
    setDeliveryDate("");
    setDeliveryTime("");
    setRecipientName("");
    setRecipientPhone("");
    setLogisticsNotes("");
    setScheduleMode("delivery");
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
      resetSale,
      currentStep, setCurrentStep,
      pickupDate, setPickupDate,
      pickupTime, setPickupTime,
      deliveryDate, setDeliveryDate,
      deliveryTime, setDeliveryTime,
      recipientName, setRecipientName,
      recipientPhone, setRecipientPhone,
      logisticsNotes, setLogisticsNotes,
      scheduleMode, setScheduleMode
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
