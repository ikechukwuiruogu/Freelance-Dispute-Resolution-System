;; Arbitration Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_RESOLVED (err u409))

;; Data Maps
(define-map disputes
  { job-id: uint }
  {
    client: principal,
    freelancer: principal,
    arbiter: (optional principal),
    status: (string-ascii 20),
    resolution: (optional (string-ascii 20))
  }
)

(define-map arbiters
  { arbiter: principal }
  { is-approved: bool }
)

;; Functions
(define-public (register-arbiter (arbiter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (ok (map-set arbiters { arbiter: arbiter } { is-approved: true }))
  )
)

(define-public (initiate-dispute (job-id uint))
  (let
    ((job (unwrap! (contract-call? .job-contract get-job job-id) ERR_NOT_FOUND))
     (escrow (unwrap! (contract-call? .escrow-contract get-escrow job-id) ERR_NOT_FOUND)))
    (asserts! (or (is-eq tx-sender (get client escrow)) (is-eq tx-sender (get freelancer escrow))) ERR_NOT_AUTHORIZED)
    (ok (map-set disputes
      { job-id: job-id }
      {
        client: (get client escrow),
        freelancer: (get freelancer escrow),
        arbiter: none,
        status: "OPEN",
        resolution: none
      }
    ))
  )
)

(define-public (assign-arbiter (job-id uint) (arbiter principal))
  (let
    ((dispute (unwrap! (map-get? disputes { job-id: job-id }) ERR_NOT_FOUND))
     (is-approved-arbiter (default-to false (get is-approved (map-get? arbiters { arbiter: arbiter })))))
    (asserts! is-approved-arbiter ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status dispute) "OPEN") ERR_ALREADY_RESOLVED)
    (ok (map-set disputes
      { job-id: job-id }
      (merge dispute { arbiter: (some arbiter), status: "IN_PROGRESS" })
    ))
  )
)

(define-public (resolve-dispute (job-id uint) (resolution (string-ascii 20)))
  (let
    ((dispute (unwrap! (map-get? disputes { job-id: job-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq (some tx-sender) (get arbiter dispute)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status dispute) "IN_PROGRESS") ERR_ALREADY_RESOLVED)
    (ok (map-set disputes
      { job-id: job-id }
      (merge dispute { status: "RESOLVED", resolution: (some resolution) })
    ))
  )
)

(define-read-only (get-dispute (job-id uint))
  (map-get? disputes { job-id: job-id })
)

