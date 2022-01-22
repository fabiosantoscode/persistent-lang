/**
 * Return this (or a subclass) from a custom function to indicate your interest in stopping execution.
 *
 * It will make the VM return the same Ticket to you, and change its state to "yielded".
 *
 * You can place a response back into the same VM at a later date.
 **/
export class Ticket {
  constructor(ticket) {
    this.value = ticket
  }
}

export class WaitTicket extends Ticket {
  constructor(targetTime) {
    super(targetTime)
  }
}
