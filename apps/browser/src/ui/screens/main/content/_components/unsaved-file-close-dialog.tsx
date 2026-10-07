import { Button } from '@stagewise/stage-ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@stagewise/stage-ui/components/dialog';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FileTabUnsavedEditEntry } from '../../file-tree/file-tab-unsaved-edits';

type UnsavedFileCloseDialogProps = {
  entry: FileTabUnsavedEditEntry | null;
  onKeepOpen: () => void;
  onCancelWithoutSave: () => void;
  onSaveAndClose: () => Promise<void>;
};

export function UnsavedFileCloseDialog({
  entry,
  onKeepOpen,
  onCancelWithoutSave,
  onSaveAndClose,
}: UnsavedFileCloseDialogProps) {
  const { t } = useTranslation('content');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(open) => !open && !isSaving && onKeepOpen()}
    >
      <DialogContent>
        {!isSaving && <DialogClose />}
        <DialogHeader>
          <DialogTitle>{t('unsavedClose.title')}</DialogTitle>
          <DialogDescription>
            {entry
              ? t('unsavedClose.description', { path: entry.relativePath })
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="primary"
            size="sm"
            disabled={isSaving}
            onClick={() => {
              setIsSaving(true);
              void onSaveAndClose().finally(() => setIsSaving(false));
            }}
          >
            {isSaving ? (
              <Loader2Icon className="mr-2 size-3 animate-spin" />
            ) : null}
            {t('unsavedClose.saveAndClose')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancelWithoutSave}
            disabled={isSaving}
          >
            {t('unsavedClose.closeWithoutSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
