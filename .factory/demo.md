# Demo sandbox

Open `/?demo=1` or `/demo`. The landing-page action opens `/?demo=1` in one click.

The first viewport shows two fictional files, `project-update.txt` and `meeting-notes.txt`. It also shows recipient Maya, an email ZIP route, a text-message access-phrase route, and **Create sample handoff**. **Change sample details** reveals the populated builder.

Demo records use the IndexedDB database `demo:confidential-file-handoff`. Real records use `confidential-file-handoff`. Demo mode does not read or change the real database or real license storage.

**Reset demo** clears the demo database, discards prepared downloads, and restores the sample. **Start for real** clears the demo database before returning to normal mode. The service worker caches the demo shell and sample generation works offline after the first visit.
