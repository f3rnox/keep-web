'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { hashMasterPasswordVerifier } from './hashMasterPasswordVerifier'
import { lockGlobalEncryptionSession } from './globalEncryptionSession'
import {
  clearMasterPasswordVerifier,
  getMasterPasswordVerifierSnapshot,
  getMasterPasswordServerSnapshot,
  hasMasterPasswordSnapshot,
  setMasterPasswordVerifier,
  subscribeMasterPassword,
} from './masterPasswordStore'
import { unlockGlobalEncryption } from './unlockGlobalEncryption'
import { verifyMasterPassword } from './verifyMasterPassword'

/**
 * API exposed by the `useMasterPassword` hook.
 */
export interface MasterPasswordApi {
  hasMasterPassword: boolean
  setMasterPassword: (password: string) => Promise<void>
  changeMasterPassword: (currentPassword: string, nextPassword: string) => Promise<void>
  clearMasterPassword: (currentPassword: string) => Promise<void>
}

/**
 * Subscribes to the configured master encryption password preference.
 */
export function useMasterPassword(): MasterPasswordApi {
  const hasMasterPassword: boolean = useSyncExternalStore(
    subscribeMasterPassword,
    hasMasterPasswordSnapshot,
    (): boolean => getMasterPasswordServerSnapshot() !== null,
  )

  const setMasterPassword = useCallback(async (password: string): Promise<void> => {
    const verifier = await hashMasterPasswordVerifier(password)
    setMasterPasswordVerifier(verifier)
    await unlockGlobalEncryption(password)
  }, [])

  const changeMasterPassword = useCallback(
    async (currentPassword: string, nextPassword: string): Promise<void> => {
      const verifier = getMasterPasswordVerifierSnapshot()
      if (verifier === null) {
        throw new Error('No master password configured')
      }

      const valid: boolean = await verifyMasterPassword(currentPassword, verifier)
      if (!valid) {
        throw new Error('Incorrect password')
      }

      const nextVerifier = await hashMasterPasswordVerifier(nextPassword)
      setMasterPasswordVerifier(nextVerifier)
      await unlockGlobalEncryption(nextPassword)
    },
    [],
  )

  const clearMasterPassword = useCallback(async (currentPassword: string): Promise<void> => {
    const verifier = getMasterPasswordVerifierSnapshot()
    if (verifier === null) return

    const valid: boolean = await verifyMasterPassword(currentPassword, verifier)
    if (!valid) {
      throw new Error('Incorrect password')
    }

    clearMasterPasswordVerifier()
    lockGlobalEncryptionSession()
  }, [])

  return {
    hasMasterPassword,
    setMasterPassword,
    changeMasterPassword,
    clearMasterPassword,
  }
}
