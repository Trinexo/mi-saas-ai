# Setup remoto GitHub en 10 minutos (garantía real)

Repositorio objetivo: Trinexo/mi-saas-ai
Rama protegida: main

## 0) Prerrequisitos de permisos
Necesitas una cuenta con rol Maintain o Admin en el repo.

## 1) Instalar GitHub CLI (si no está)
PowerShell:
winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements

## 2) Login con cuenta GitHub (device flow)
PowerShell:
& "C:\Program Files\GitHub CLI\gh.exe" auth login --hostname github.com --git-protocol ssh --web --skip-ssh-key

Completa el login en navegador usando el código que muestra terminal.

## 3) Verificar sesión
PowerShell:
& "C:\Program Files\GitHub CLI\gh.exe" auth status

Debe mostrar sesión activa en github.com.

## 4) Aplicar protección de rama main (forzada)
PowerShell:
$owner = "Trinexo"
$repo = "mi-saas-ai"
$body = @'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "test-backend" },
      { "context": "build-frontend" }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
'@

$body | & "C:\Program Files\GitHub CLI\gh.exe" api -X PUT \
  repos/$owner/$repo/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input -

## 5) Verificar protección aplicada
PowerShell:
& "C:\Program Files\GitHub CLI\gh.exe" api repos/Trinexo/mi-saas-ai/branches/main/protection

## 6) Garantía por evidencia (cada PR)
Guardar estos datos en el cierre de sprint:
- URL PR
- checks en verde (test-backend, build-frontend)
- número de aprobaciones
- SHA mergeado
- enlace a release note

## 7) Comprobación final de cierre Sprint 3
- PR mergeado en main
- tablero movido a Done
- release note publicado y enlazado en docs/README.md

Si alguno falla, el sprint no se marca como cerrado.