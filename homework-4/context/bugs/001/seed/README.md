# Seed snapshot — the "before" state

Pristine copy of the application exactly as it stands **before** the four-agent
pipeline runs: all seeded defects present, baseline suite at 5 pass / 7 fail.

The pipeline rewrites `src/`, adds files to `tests/`, and may touch
`package.json`. This directory is what step `[0]` of the orchestrator copies
back so that every run starts from an identical state.

## Restore

    cp -R context/bugs/001/seed/src        .
    cp -R context/bugs/001/seed/tests      .
    cp -R context/bugs/001/seed/data       .
    cp    context/bugs/001/seed/package*.json .

Files that the unit-test generator added in a previous run are **not** in this
snapshot, so `tests/` must be emptied before restoring — otherwise generated
tests accumulate across runs.

## Why a copy and not git

Restoring through `git checkout` would discard uncommitted work in the rest of
the repository if a path is mistyped. This directory touches nothing outside
the application itself.

Do not edit these files directly. Change the application, verify it, then
refresh the snapshot.
