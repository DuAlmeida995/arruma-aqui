# Bloqueios (precisam de um humano)

## 1. Certificado CA do Supabase (Fase 0.3)
A conexão com o banco falha com `self-signed certificate in certificate chain`: o Supabase usa uma CA própria.
Não vamos desligar a verificação TLS. Para resolver:
1. Supabase Dashboard → **Project Settings → Database → SSL Configuration → Download certificate**.
2. Salve o arquivo como `backend/db/supabase-ca.crt` (é um certificado público, pode ir para o git).
3. Rode `node -e 'require("./db").checkDb().then(console.log)'` dentro de `backend/` — deve imprimir `ok`.

Enquanto isso o loop escreve as migrations e o seed, mas não consegue aplicá-los no banco.
