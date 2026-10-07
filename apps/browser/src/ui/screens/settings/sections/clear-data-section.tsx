import { useState } from 'react';
import { Button } from '@stagewise/stage-ui/components/button';
import { Checkbox } from '@stagewise/stage-ui/components/checkbox';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import { useKartonProcedure } from '@ui/hooks/use-karton';
import { Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type DataType =
  | 'history'
  | 'favicons'
  | 'downloads'
  | 'cookies'
  | 'cache'
  | 'storage'
  | 'indexedDB'
  | 'serviceWorkers'
  | 'cacheStorage'
  | 'permissionExceptions';

const dataOptionIds: DataType[] = [
  'history',
  'downloads',
  'cookies',
  'cache',
  'storage',
  'indexedDB',
  'cacheStorage',
  'serviceWorkers',
  'favicons',
  'permissionExceptions',
];

export function ClearDataSection() {
  const { t } = useTranslation('settings');
  const [selectedTypes, setSelectedTypes] = useState<Set<DataType>>(
    new Set([
      'history',
      'downloads',
      'cookies',
      'cache',
      'storage',
      'indexedDB',
      'cacheStorage',
      'serviceWorkers',
      'favicons',
    ] as const),
  );
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const clearBrowsingData = useKartonProcedure(
    (p) => p.browser.clearBrowsingData,
  );

  const toggleDataType = (type: DataType) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleClearData = async (timeRange: 'last24h' | 'allTime') => {
    if (selectedTypes.size === 0) {
      setResult({
        success: false,
        message: t('clearData.selectError'),
      });
      return;
    }

    setIsClearing(true);
    setResult(null);

    try {
      const now = new Date();
      const options = {
        history: selectedTypes.has('history'),
        favicons: selectedTypes.has('favicons'),
        downloads: selectedTypes.has('downloads'),
        cookies: selectedTypes.has('cookies'),
        cache: selectedTypes.has('cache'),
        storage: selectedTypes.has('storage'),
        indexedDB: selectedTypes.has('indexedDB'),
        serviceWorkers: selectedTypes.has('serviceWorkers'),
        cacheStorage: selectedTypes.has('cacheStorage'),
        permissionExceptions: selectedTypes.has('permissionExceptions'),
        timeRange:
          timeRange === 'last24h'
            ? {
                start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                end: now,
              }
            : undefined,
        vacuum: true,
      };

      const response = await clearBrowsingData(options);

      if (response.success) {
        const clearedItems: string[] = [];
        if (response.historyEntriesCleared) {
          clearedItems.push(
            t('clearData.items.history', {
              count: response.historyEntriesCleared,
            }),
          );
        }
        if (response.downloadsCleared === true) {
          clearedItems.push(t('clearData.items.downloads'));
        }
        if (response.faviconsCleared) {
          clearedItems.push(
            t('clearData.items.favicons', { count: response.faviconsCleared }),
          );
        }
        if (response.cookiesCleared) {
          clearedItems.push(t('clearData.items.cookies'));
        }
        if (response.cacheCleared) {
          clearedItems.push(t('clearData.items.cache'));
        }
        if (response.storageCleared) {
          clearedItems.push(t('clearData.items.storage'));
        }
        if (response.permissionExceptionsCleared) {
          clearedItems.push(t('clearData.items.permissionExceptions'));
        }

        setResult({
          success: true,
          message:
            clearedItems.length > 0
              ? t('clearData.successCleared', {
                  items: clearedItems.join(', '),
                })
              : t('clearData.success'),
        });
      } else {
        setResult({
          success: false,
          message: response.error || t('clearData.failed'),
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : t('clearData.failed'),
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="h-full w-full">
      {/* Content */}
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-semibold text-foreground text-xl">
              {t('clearData.title')}
            </h1>
          </div>
          {/* Data Selection Section */}
          <section className="space-y-4">
            <div>
              <h2 className="font-medium text-foreground text-lg">
                {t('clearData.selectTitle')}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {dataOptionIds.map((id) => (
                <label
                  key={id}
                  className="flex cursor-pointer select-none items-start gap-3 rounded-lg border border-derived bg-background p-2.5 transition-colors hover:bg-hover-derived"
                  htmlFor={id}
                >
                  <Checkbox
                    id={id}
                    checked={selectedTypes.has(id)}
                    onCheckedChange={() => toggleDataType(id)}
                    className="mt-0.5"
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="text-foreground text-sm">
                      {t(`clearData.options.${id}.label`)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t(`clearData.options.${id}.description`)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          <section>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => handleClearData('last24h')}
                disabled={isClearing || selectedTypes.size === 0}
                variant="secondary"
                size="sm"
              >
                {isClearing ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    {t('clearData.clearing')}
                  </>
                ) : (
                  t('clearData.clearLast24h')
                )}
              </Button>

              <Button
                onClick={() => handleClearData('allTime')}
                disabled={isClearing || selectedTypes.size === 0}
                variant="primary"
                size="sm"
              >
                {isClearing ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    {t('clearData.clearing')}
                  </>
                ) : (
                  t('clearData.clearAllTime')
                )}
              </Button>
            </div>
          </section>

          {/* Result Message */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.success
                  ? 'border border-derived-strong bg-success-background text-success-foreground'
                  : 'border border-derived-strong bg-error-background text-error-foreground'
              }`}
            >
              <p className="text-sm">{result.message}</p>
            </div>
          )}
        </div>
      </OverlayScrollbar>
    </div>
  );
}
