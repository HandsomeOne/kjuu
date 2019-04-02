export class JASON {
  constructor(public value: unknown) {}
  toString() {
    return JSON.stringify(this.value)
  }
}

export default (value: unknown) => new JASON(value)
