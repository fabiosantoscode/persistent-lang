# persistent-lang

A language that has an extreme capacity to chill out. You can save your program's state to disk or your store of choice. And you can "run" millions of concurrent processes for cheap, since you can move them to any persistent storage of your choice.

You might use this to control a process that is run by multiple machines and can last multiple days or months, without worrying about keeping a machine running for that purpose.

Here are some examples that don't currently work because this is WIP AF:

# Examples

Here's a program that controls a subscription to a paid membership

```javascript
import { createProgram } from 'persistent-lang'
import { saveStateToDisk, loadStateFromDisk } from './your-stuff.js'
import {
  charge,
  setSubscriptionActive,
  SUBSCRIPTION_DURATION_MS,
  GRACE_PERIOD_MS,
} from './your-subscription-management.js'

const machine = createProgram`
  (if (== (chargeCustomer customerId) "charge-failed")
    (exit "charge-failed"))

  (${setSubscriptionActive} customerId true)

  (while true
    (wait ${SUBSCRIPTION_DURATION_MS})
    (if cancelled
      (exit "cancelled"))
    (if (== (chargeCustomer customerId) "charge-failed")
      (gracePeriod customerId)))

  (fn gracePeriod [customerId]
    # Give the customer a grace period, before disabling the customer's
    # subscription and giving up
    (set emailResult
      (race
        (chargeCustomer customerId)
        (wait ${GRACE_PERIOD_MS} "timed-out")))

    (if (== emailResult "timed-out")
      (do
        (${setSubscriptionActive} customerId false)
        (exit "charge-failed"))))

  (fn chargeCustomer []
    (yield "chargeCustomer"))
`({
  yieldPoints: {
    async chargeCustomer(state) {
      const customerId = state.processId
      await charge(customerId)
    },
  },
  async loadState(processId) {
    return await loadStateFromDisk(processId)
  },
  async saveState(processId, newState) {
    return await saveStateToDisk(processId, newState)
  },
  async handleExit(processId, exitArg) {
    // Send a sad e-mail to the customer
  },
})

export function createSubscription(customerId) {
  await machine.spawnProcess({
    processId: customerId,
    variables: { customerId, cancelled: false },
  })
}

export async function handleChargeSuccessful(customerId) {
  const state = await machine.loadState(customerId)
  if (state.yielded !== 'chargeCustomer') {
    // We weren't expecting a charge, what's up?
    throw Refund()
  }

  // Continue running
  await state.satisfyYield()
}

export async function handleCancellation(customerId, cancelled = true) {
  const state = await machine.loadState(customerId)
  await state.changeGlobalVariable(state, 'cancelled', cancelled)
}

// TODO explain how waiting works, I don't know how yet but Redis will likely be involved
```
