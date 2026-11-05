// Validação de entrada com zod. Uso: router.get("/:id", validate({ params: idParam }), handler)
// O resultado validado fica em req.valid.{params,query,body}; erro → 400 com a primeira mensagem.
const { z } = require("zod");

function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    for (const part of ["params", "query", "body"]) {
      if (!schemas[part]) continue;
      const parsed = schemas[part].safeParse(req[part] ?? {});
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Dados inválidos." });
      req.valid[part] = parsed.data;
    }
    next();
  };
}

// ids numéricos positivos (evita "abc" virar NaN e quebrar a consulta)
const id = (msg = "Identificador inválido.") => z.coerce.number({ message: msg }).int(msg).positive(msg).max(Number.MAX_SAFE_INTEGER, msg);
const idParam = z.object({ id: id() });

module.exports = { validate, id, idParam, z };
