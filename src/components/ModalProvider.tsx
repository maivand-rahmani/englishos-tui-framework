import { useRef, useCallback, type ReactNode } from 'react'
import { Box, Text } from 'ink'
import { useNavigation } from '../navigation/NavigationProvider.js'
import { useTheme } from '../design-system/ThemeProvider.js'
import { useInputInScope } from '../interaction/useInputInScope.js'

export interface ModalProviderProps {
  children: ReactNode
  onClose?: () => void
}

export function ModalProvider({ children, onClose }: ModalProviderProps) {
  const { isModalOpen, currentModal, popModal, modalStack } = useNavigation()
  const { colors } = useTheme()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useInputInScope(
    (input, key) => {
      if (key.escape) {
        if (onCloseRef.current) {
          onCloseRef.current()
        }
        popModal()
      }
    },
    'modal',
    [popModal],
  )

  if (!isModalOpen || !currentModal) {
    return <>{children}</>
  }

  return (
    <Box flexDirection="column" width="100%">
      <Box>
        <Text dimColor>{'  '}</Text>
      </Box>
      <Box flexDirection="column" alignItems="center" justifyContent="center">
        <Box
          borderStyle="round"
          borderColor={colors.focus.ring}
          paddingX={1}
          paddingY={1}
        >
          {currentModal.component()}
        </Box>
      </Box>
      {modalStack.length > 1 && (
        <Box>
          <Text dimColor>
            {modalStack.length - 1} more modal
            {modalStack.length > 2 ? 's' : ''}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export function useModal() {
  const { pushModal, popModal, isModalOpen, currentModal } = useNavigation()

  const openModal = useCallback(
    (screenId: string, props?: Record<string, unknown>) => {
      pushModal(screenId, props)
    },
    [pushModal],
  )

  const closeModal = useCallback(() => {
    popModal()
  }, [popModal])

  return {
    openModal,
    closeModal,
    isOpen: isModalOpen,
    currentModal,
  }
}
