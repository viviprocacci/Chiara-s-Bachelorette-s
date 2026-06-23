import PageHeader from '@/components/layout/PageHeader'
import ExpenseTracker from '@/components/expenses/ExpenseTracker'

export default function ExpensesPage() {
  return (
    <div className="page-container">
      <PageHeader title="Cost Split" />
      <div className="scroll-content">
        <ExpenseTracker />
      </div>
    </div>
  )
}
