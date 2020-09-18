export class MockRedis extends Map {
  constructor() {
    super();
  }
  del = this.delete;
}
