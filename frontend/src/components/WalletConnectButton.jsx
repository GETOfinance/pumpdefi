import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'

const WalletConnectButton = ({ 
  className = "btn btn-primary btn-lg",
  showIcon = true,
  text = "Connect Wallet",
  size = "lg"
}) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={className}
                  >
                    {showIcon && <Wallet className="h-5 w-5 mr-2" />}
                    {text}
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="btn btn-secondary"
                  >
                    Wrong network
                  </button>
                )
              }

              // If connected and on correct network, show account info
              return (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openChainModal}
                    className={`btn btn-secondary ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''}`}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={`btn btn-primary ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''}`}
                  >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export default WalletConnectButton
