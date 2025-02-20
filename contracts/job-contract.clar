;; Job Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map jobs
  { job-id: uint }
  {
    client: principal,
    freelancer: (optional principal),
    title: (string-ascii 100),
    description: (string-utf8 1000),
    budget: uint,
    status: (string-ascii 20)
  }
)

(define-data-var job-id-nonce uint u0)

;; Functions
(define-public (post-job (title (string-ascii 100)) (description (string-utf8 1000)) (budget uint))
  (let
    ((job-id (+ (var-get job-id-nonce) u1)))
    (try! (stx-transfer? budget tx-sender (as-contract tx-sender)))
    (map-set jobs
      { job-id: job-id }
      {
        client: tx-sender,
        freelancer: none,
        title: title,
        description: description,
        budget: budget,
        status: "OPEN"
      }
    )
    (var-set job-id-nonce job-id)
    (ok job-id)
  )
)

(define-public (apply-for-job (job-id uint))
  (let
    ((job (unwrap! (map-get? jobs { job-id: job-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq (get status job) "OPEN") (err u403))
    (ok (map-set jobs
      { job-id: job-id }
      (merge job { freelancer: (some tx-sender) })
    ))
  )
)

(define-public (accept-application (job-id uint) (freelancer principal))
  (let
    ((job (unwrap! (map-get? jobs { job-id: job-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq (get client job) tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status job) "OPEN") (err u403))
    (ok (map-set jobs
      { job-id: job-id }
      (merge job { freelancer: (some freelancer), status: "IN_PROGRESS" })
    ))
  )
)

(define-read-only (get-job (job-id uint))
  (map-get? jobs { job-id: job-id })
)

(define-public (complete-job (job-id uint))
  (let
    ((job (unwrap! (map-get? jobs { job-id: job-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq (some tx-sender) (get freelancer job)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status job) "IN_PROGRESS") (err u403))
    (ok (map-set jobs
      { job-id: job-id }
      (merge job { status: "COMPLETED" })
    ))
  )
)

