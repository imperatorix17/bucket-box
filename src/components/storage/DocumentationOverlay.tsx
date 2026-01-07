import { X, Book, Database, Upload, Folder, Lock, Globe, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentationOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentationOverlay({ open, onClose }: DocumentationOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in overflow-auto">
      <div className="container mx-auto max-w-4xl p-6 md:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">CloudVault Documentation</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Introduzione
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CloudVault è un sistema di gestione file cloud che ti permette di organizzare, 
              caricare e gestire i tuoi file in modo sicuro. I file sono organizzati in bucket, 
              contenitori logici che possono essere pubblici o privati.
            </p>
          </section>

          {/* Buckets */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-destructive" />
              Bucket
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              I bucket sono contenitori per i tuoi file. Ogni bucket può essere configurato come:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-warning" />
                  <span className="font-medium">Privato</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  I file non sono accessibili pubblicamente. Solo gli utenti autenticati possono accedervi.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-success" />
                  <span className="font-medium">Pubblico</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  I file sono accessibili a chiunque tramite URL pubblico. Ideale per contenuti condivisibili.
                </p>
              </div>
            </div>
          </section>

          {/* Upload */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Caricamento File
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Per caricare file, puoi:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Trascinare e rilasciare i file nell'area di drop</li>
              <li>Cliccare sul pulsante "Upload" nella barra degli strumenti</li>
              <li>I file vengono caricati automaticamente nella cartella corrente</li>
            </ul>
          </section>

          {/* Folders */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Folder className="w-5 h-5 text-warning" />
              Cartelle
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Puoi creare cartelle per organizzare i tuoi file. Le cartelle possono essere nidificate 
              a qualsiasi livello. Usa il pulsante "New Folder" per creare una nuova cartella.
            </p>
          </section>

          {/* File Preview */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Anteprima File
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cliccando su un file si apre il pannello di anteprima che mostra:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>Anteprima del contenuto (immagini, codice, testo)</li>
              <li>Informazioni sul file (nome, dimensione, tipo, data modifica)</li>
              <li>Azioni rapide (download, copia URL, elimina)</li>
            </ul>
          </section>

          {/* Delete */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Eliminazione
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Puoi eliminare file, cartelle e bucket. Attenzione: l'eliminazione è permanente 
              e non può essere annullata. L'eliminazione di una cartella rimuove anche tutti 
              i file al suo interno.
            </p>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Scorciatoie da Tastiera</h2>
            <div className="grid gap-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Seleziona tutti</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + A</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Elimina selezionati</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Delete</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Ricerca</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + F</kbd>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          CloudVault v1.0 - Built with ❤️
        </div>
      </div>
    </div>
  );
}
