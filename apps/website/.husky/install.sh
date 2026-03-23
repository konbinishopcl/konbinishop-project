#!/usr/bin/env sh

echo "🔧 Configurando Husky hooks..."

# Crear directorio .husky si no existe
mkdir -p .husky

# Hacer ejecutables todos los hooks
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

echo "✅ Husky hooks configurados correctamente"
echo "📋 Hooks disponibles:"
echo "   - pre-commit: Formatea y valida código antes del commit"
echo "   - pre-push: Valida todo el código antes del push"
