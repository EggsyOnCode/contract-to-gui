import React from 'react';
import { CompilerSettings } from '../types';

interface CompilerSettingsProps {
  settings: CompilerSettings;
  onSettingsChange: (settings: CompilerSettings) => void;
  availableSolcVersions: string[];
  availableEVMVersions: string[];
}

export const CompilerSettingsComponent: React.FC<CompilerSettingsProps> = ({
  settings,
  onSettingsChange,
  availableSolcVersions,
  availableEVMVersions,
}) => {
  const handleChange = (field: keyof CompilerSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className="compiler-settings">
      <h3>Compiler Settings</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="solc-version">Solidity Version:</label>
          <select
            id="solc-version"
            value={settings.solcVersion}
            onChange={(e) => handleChange('solcVersion', e.target.value)}
          >
            {availableSolcVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="evm-version">EVM Version:</label>
          <select
            id="evm-version"
            value={settings.evmVersion}
            onChange={(e) => handleChange('evmVersion', e.target.value)}
          >
            {availableEVMVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="optimization">Optimization:</label>
          <select
            id="optimization"
            value={settings.optimization ? 'enabled' : 'disabled'}
            onChange={(e) => handleChange('optimization', e.target.value === 'enabled')}
          >
            <option value="disabled">Disabled</option>
            <option value="enabled">Enabled</option>
          </select>
        </div>

        {settings.optimization && (
          <div className="setting-group">
            <label htmlFor="runs">Optimization Runs:</label>
            <input
              id="runs"
              type="number"
              value={settings.runs || 200}
              onChange={(e) => handleChange('runs', parseInt(e.target.value) || 200)}
              min="1"
              max="10000"
            />
          </div>
        )}
      </div>
    </div>
  );
};
