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

;; Add a successful payment between payer and payee
(define-public (record-successful-payment (payee principal) (amount uint))
  (begin
    ;; Transfer STX from payer to payee
    (stx-transfer? amount tx-sender payee)

    ;; Update the payment record
    (let* (
      (payer tx-sender)
      (key { payer: payer, payee: payee })
      (prev (default-to { total-paid: u0, successful-payments: u0, failed-payments: u0 } (map-get? payments key)))
      (new-payment {
        total-paid: (+ (get total-paid prev) amount),
        successful-payments: (+ (get successful-payments prev) u1),
        failed-payments: (get failed-payments prev)
      })
    )
      (map-set payments key new-payment)

      ;; Update reputation
      (let* (
        (old-rep (default-to { score: 0, total-transactions: u0 } (map-get? reputations payer)))
        (new-rep {
          score: (+ (get score old-rep) 10), ;; reward +10
          total-transactions: (+ (get total-transactions old-rep) u1)
        })
      )
        (map-set reputations payer new-rep)
      )
    )
    (ok true)
  )
)

;; Penalize a payer manually (e.g. for dispute)
(define-public (penalize-payer (payer principal) (penalty int))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err u100))
    (let (
      (old-rep (default-to { score: 0, total-transactions: u0 } (map-get? reputations payer)))
      (new-score (- (get score old-rep) penalty))
    )
      (map-set reputations payer {
        score: new-score,
        total-transactions: (get total-transactions old-rep)
      })
      (ok true)
    )
  )
)
