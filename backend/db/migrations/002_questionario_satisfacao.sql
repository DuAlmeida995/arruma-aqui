-- Nota do aplicativo, distinta da avaliação do serviço prestado.
alter table services add column satisfaction_score smallint
  check (satisfaction_score between 1 and 5);
