// Persistence simulator for application-level tests when mongod cannot run locally.
// Integration mode in zarinpal.test.js exercises real MongoDB transactions instead.
module.exports = function install(models, mongoose) {
  const stores = new Map(models.map(M => [M.modelName, new Map()]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const pathGet = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
  function match(doc, filter) {
    return Object.entries(filter).every(([k, v]) => k === '$or' ? v.some(f => match(doc, f)) : String(pathGet(doc, k)) === String(v));
  }
  function set(doc, update) {
    for (const [path, value] of Object.entries(update.$set || update)) {
      const parts = path.split('.'); let obj = doc;
      for (const p of parts.slice(0, -1)) obj = obj[p] ||= {};
      obj[parts.at(-1)] = value;
    }
  }
  for (const Model of models) {
    const store = () => stores.get(Model.modelName);
    function hydrate(value) { return value ? Model.hydrate(clone(value)) : null; }
    function query(fn) { return { then(ok, fail) { return Promise.resolve().then(fn).then(ok, fail); }, lean() { return Promise.resolve().then(fn).then(d => d?.toObject() || null); }, session() { return this; } }; }
    Model.prototype.save = async function () {
      await this.validate();
      if (this.checkoutKey && [...store().values()].some(d => String(d._id) !== String(this._id) && String(d.user) === String(this.user) && d.checkoutKey === this.checkoutKey)) throw Object.assign(new Error('duplicate'), { code: 11000 });
      store().set(String(this._id), clone(this.toObject())); return this;
    };
    Model.create = async data => new Model(data).save();
    Model.init = async () => Model;
    Model.deleteMany = async () => store().clear();
    Model.countDocuments = async () => store().size;
    Model.findOne = (filter = {}) => query(() => hydrate([...store().values()].find(d => match(d, filter))));
    Model.findById = id => Model.findOne({ _id: id });
    Model.findOneAndUpdate = (filter, update) => query(() => {
      const d = [...store().values()].find(d => match(d, filter)); if (!d) return null;
      set(d, update); return hydrate(d);
    });
    Model.findByIdAndUpdate = (id, update) => Model.findOneAndUpdate({ _id: id }, update);
    Model.updateOne = async (filter, update) => Model.findOneAndUpdate(filter, update);
  }
  mongoose.connection.db = { admin: () => ({ command: async () => ({ setName: 'simulated' }) }) };
  let queue = Promise.resolve();
  mongoose.startSession = async () => ({
    async withTransaction(fn) {
      const operation = queue.then(async () => {
        const before = new Map([...stores].map(([k, s]) => [k, new Map([...s].map(([id, d]) => [id, clone(d)]))]));
        try { return await fn(); } catch (e) { for (const [k, s] of before) stores.set(k, s); throw e; }
      });
      queue = operation.catch(() => {}); return operation;
    }, async endSession() {},
  });
};
