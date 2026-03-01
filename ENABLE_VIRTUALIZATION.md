# Enable Virtualization on Windows

## What is Virtualization?

Virtualization is a CPU feature that allows running virtual machines and Docker containers. It's disabled by default on many computers.

---

## Step 1: Check if Virtualization is Enabled

### Method 1: Task Manager
1. Press `Ctrl + Shift + Esc` (opens Task Manager)
2. Click "Performance" tab
3. Click "CPU"
4. Look for "Virtualization: Enabled" or "Disabled"

### Method 2: System Information
1. Press `Windows Key + R`
2. Type `msinfo32` and press Enter
3. Look for "Virtualization Enabled in Firmware: Yes/No"

---

## Step 2: Enable Virtualization in BIOS/UEFI

### For Most Computers:

1. **Restart your computer**

2. **Enter BIOS/UEFI Setup**
   - Press the BIOS key during boot (usually one of these):
     - `F2` (most common - Dell, Lenovo, Acer)
     - `F10` (HP)
     - `F12` (some Dell)
     - `Del` or `Delete` (MSI, ASUS)
     - `Esc` (some HP)
   - **Tip:** Start pressing the key repeatedly as soon as you see the manufacturer logo

3. **Find Virtualization Settings**
   
   Look for one of these menu locations:
   - **Advanced** → CPU Configuration
   - **Advanced** → System Configuration
   - **Configuration** → Virtualization Technology
   - **Security** → Virtualization
   - **Processor** → Virtualization Technology

4. **Enable the Setting**
   
   Look for one of these options and set to **Enabled**:
   - **Intel Virtualization Technology** (Intel VT-x)
   - **AMD-V** or **SVM Mode** (AMD processors)
   - **Virtualization Technology**
   - **VT-x** or **VT-d**

5. **Save and Exit**
   - Usually `F10` to save
   - Confirm "Yes" to save changes
   - Computer will restart

---

## Step 3: Verify Virtualization is Enabled

After reboot:

1. Open Task Manager (`Ctrl + Shift + Esc`)
2. Performance → CPU
3. Should now show: **Virtualization: Enabled**

---

## Step 4: Enable Windows Features

After enabling virtualization in BIOS:

```powershell
# Run PowerShell as Administrator

# Enable Hyper-V (Windows Pro/Enterprise)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Restart computer
Restart-Computer
```

OR manually:
1. Open "Turn Windows features on or off"
2. Check these boxes:
   - ✅ Hyper-V (if available)
   - ✅ Virtual Machine Platform
   - ✅ Windows Subsystem for Linux
3. Click OK
4. Restart computer

---

## Step 5: Start Docker Desktop

After restart:
1. Open Docker Desktop
2. It should start successfully now
3. Wait for whale icon in system tray
4. Verify: `docker ps` in PowerShell

---

## Brand-Specific BIOS Instructions

### Dell
- Boot key: `F2`
- Location: Advanced → Virtualization Support
- Setting: Enable Intel Virtualization Technology

### HP
- Boot key: `F10` or `Esc`
- Location: Configuration → Virtualization Technology
- Setting: Enabled

### Lenovo
- Boot key: `F2` or `F1`
- Location: Security → Virtualization
- Setting: Enable Intel VT

### ASUS
- Boot key: `Del` or `F2`
- Location: Advanced → CPU Configuration
- Setting: SVM Mode (AMD) or Intel Virtualization Technology (Intel)

### Acer
- Boot key: `F2`
- Location: Main → Intel Virtualization Technology
- Setting: Enabled

### MSI
- Boot key: `Del`
- Location: OC → CPU Features
- Setting: Intel Virtualization Tech: Enabled

---

## Troubleshooting

### Issue: Can't enter BIOS

**Solution:**
1. From Windows, go to Settings → Update & Security → Recovery
2. Under "Advanced startup", click "Restart now"
3. Choose Troubleshoot → Advanced Options → UEFI Firmware Settings
4. Click Restart

### Issue: Virtualization option is grayed out

**Possible causes:**
1. **Hyper-V is already enabled** - This means virtualization IS working
2. **Secure Boot** - Try disabling Secure Boot in BIOS
3. **Windows Security** - Check Device Guard/Credential Guard

**To check Hyper-V:**
```powershell
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V
```

### Issue: No virtualization option in BIOS

**Solutions:**
1. Update BIOS to latest version
2. Check if your CPU supports virtualization:
   - Intel: Look for "VT-x" in CPU specs
   - AMD: Look for "AMD-V" in CPU specs
3. Some older/budget CPUs don't support virtualization

### Issue: Windows Home Edition

**Problem:** Windows Home doesn't support Hyper-V

**Solution:** Use WSL 2 backend for Docker
1. Install WSL 2: `wsl --install`
2. Restart
3. Docker Desktop will use WSL 2 instead of Hyper-V

---

## Alternative If Virtualization Can't Be Enabled

If your CPU doesn't support virtualization or you can't enable it:

### Option 1: Use Cloud ERPNext
- Deploy ERPNext on DigitalOcean, AWS, or Azure
- Run integration scripts on Windows, connect to cloud ERPNext

### Option 2: Use VirtualBox (Software Virtualization)
- Install VirtualBox (doesn't require CPU virtualization)
- Create Ubuntu VM
- Install ERPNext in Ubuntu
- Run integration scripts on Windows

### Option 3: Use WSL 2 Only
```powershell
# Install WSL 2
wsl --install

# After restart, in Ubuntu:
# Install Docker directly in WSL
sudo apt update
sudo apt install docker.io docker-compose
sudo service docker start
```

---

## Quick Check Commands

```powershell
# Check if CPU supports virtualization
systeminfo

# Look for:
# Hyper-V Requirements: A hypervisor has been detected

# Check Windows features
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# Check WSL
wsl --status
```

---

## Summary Steps

1. ✅ Restart computer
2. ✅ Enter BIOS (F2, F10, Del, or Esc during boot)
3. ✅ Find Virtualization Technology setting
4. ✅ Enable it
5. ✅ Save and exit (F10)
6. ✅ Boot to Windows
7. ✅ Enable Windows features (Hyper-V, WSL)
8. ✅ Restart again
9. ✅ Start Docker Desktop
10. ✅ Run docker-compose

---

## What to Do RIGHT NOW

1. **Restart your computer**
2. **As soon as you see the logo, press F2 repeatedly** (or F10, Del)
3. **Look for "Virtualization" settings**
4. **Enable it**
5. **Save and exit**
6. **Let Windows boot**
7. **Try Docker Desktop again**

If successful, you'll see "Virtualization: Enabled" in Task Manager.

