;; Escrow Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_RELEASED (err u409))

;; Data Maps
(define-map escrows
  { job-id: uint }
  {
    amount: uint,
    client: principal,
    freelancer: principal,
    status: (string-ascii 20)
  }
)

;; Functions
(define-public (create-escrow (job-id uint) (amount uint) (freelancer principal))
  (let
    ((job (unwrap! (contract-call? .job-contract get-job job-id) ERR_NOT_FOUND)))
    (asserts! (is-eq (get client job) tx-sender) ERR_NOT_AUTHORIZED)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ok (map-set escrows
      { job-id: job-id }
      {
        amount: amount,
        client: tx-sender,
        freelancer: freelancer,
        status: "LOCKED"
      }
    ))
  )
)

(define-public (release-escrow (job-id uint))
  (let
    ((escrow (unwrap! (map-get? escrows { job-id: job-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq (get client escrow) tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status escrow) "LOCKED") ERR_ALREADY_RELEASED)
    (try! (as-contract (stx-transfer? (get amount escrow) tx-sender (get freelancer escrow))))
    (ok (map-set escrows
      { job-id: job-id }
      (merge escrow { status: "RELEASED" })
    ))
  )
)

(define-read-only (get-escrow (job-id uint))
  (map-get? escrows { job-id: job-id })
)

