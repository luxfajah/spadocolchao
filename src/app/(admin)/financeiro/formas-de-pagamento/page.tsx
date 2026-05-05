import { getPaymentMethods } from "./actions"
import { PaymentMethodsClient } from "./PaymentMethodsClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FormasDePagamentoPage() {
  const methods = await getPaymentMethods()
  
  return (
    <div className="w-full">
      <PaymentMethodsClient initialData={methods} />
    </div>
  )
}
