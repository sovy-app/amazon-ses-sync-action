# Sovy - Amazon SES Synch Action

This action synchronizes email templates from within a Github repo with Amazon SES.

## Inputs

### `templates_dir`

**Required** A path to a directory where your email templates are stored, e.g. `${{ github.workspace }}/templates/`.

### `token`

**Required** A Sovy Github Synch Token generated inside the https://sovy.app dashboard.

## How to prepare your repo

### Repository file structure
Keep all your email templates in separate files, in a single directory, e.g. `/templates`.

### Defining email subject
Each template file should contain a single email subject defined like this:
```html
<!-- subject: Here put your email subject -->
```

## How it works

1. Listing all files from the provided directory `templates_dir`.
2. Reading contents of all found files.
3. Parsing files' contents looking for the HTML comment containing a **subject**.
4. Synching all templates with Amazon SES through Sovy using provided `token`.

If a template with a specific name does not exist in your Amazon SES account, a new template will be created.

If a template with a specific name already exists, it will be updated.

If a template that was synched through this Github Action before (created or updated) is now missing, it will be deleted from the Amazon SES as well.

If you already have templates in your Amazon SES account and there are no templates with corresponding names inside your Github repo, those templates will stay untouched.

## Example usage

```yaml
steps:
  - name: Checking out the repo
    uses: actions/checkout@v2
  - name: Setting up node
    uses: actions/setup-node@v2
    with:
      node-version: '16'
      cache: 'npm'
  - name: Synching email templates
    uses: sovy-app/amazon-ses-synch-action@v1
    with:
      templates_dir: ${{ github.workspace }}/templates/
      token: 60e77e49-8625-4b97-81ac-d573b6edbd36
```
