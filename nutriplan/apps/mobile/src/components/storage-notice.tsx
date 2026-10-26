import { LOCAL_MODE } from '../lib/config';
import { useStorageKind } from '../lib/queries';
import { Notice } from './ui';

const TEXT = {
  account: { tone: 'success' as const, text: 'Vos données sont enregistrées dans votre espace personnel : vous les retrouverez en revenant sur cette page.' },
  device: { tone: 'info' as const, text: 'Vos données sont enregistrées dans ce navigateur, sur cet appareil uniquement.' },
  memory: { tone: 'warning' as const, text: 'L’enregistrement est indisponible ici : vos réponses seront perdues si vous fermez la page.' },
};

/** Indique honnêtement où la version web autonome enregistre les données. */
export function StorageNotice() {
  const { data } = useStorageKind(LOCAL_MODE);
  if (!LOCAL_MODE || !data) return null;
  return <Notice tone={TEXT[data].tone}>{TEXT[data].text}</Notice>;
}
