(define-constant contract-owner tx-sender)

;; Each payment record
(define-map payments
  { payer: principal, payee: principal }
  {
    total-paid: uint,
    successful-payments: uint,
    failed-payments: uint
  }
)

;; Global user reputation scores
(define-map reputations
  principal
  {
    score: int, ;; Can go up or down
    total-transactions: uint
  }
)