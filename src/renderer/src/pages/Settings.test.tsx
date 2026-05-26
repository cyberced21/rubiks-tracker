import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Settings from './Settings'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Settings page', () => {
  it('renders the settings title', async () => {
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  it('renders timer settings section', async () => {
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByText('WCA Inspection')).toBeInTheDocument()
      expect(screen.getByText('Hold-to-start threshold')).toBeInTheDocument()
    })
  })

  it('renders keyboard shortcuts section', async () => {
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getAllByText('Keyboard Shortcuts').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Start / stop timer').length).toBeGreaterThan(0)
      expect(screen.getAllByText('+2 penalty').length).toBeGreaterThan(0)
      expect(screen.getAllByText('DNF').length).toBeGreaterThan(0)
    })
  })

  it('renders data export buttons', async () => {
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getAllByText('JSON').length).toBeGreaterThan(0)
      expect(screen.getAllByText('CSV').length).toBeGreaterThan(0)
    })
  })

  it('renders backup and restore buttons', async () => {
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getAllByText('Backup').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Restore').length).toBeGreaterThan(0)
    })
  })

  it('calls exportJson when JSON button is clicked', async () => {
    render(<Settings />)
    await waitFor(() => screen.getAllByText('JSON'))
    fireEvent.click(screen.getAllByText('JSON')[0])
    expect(window.api.exportJson).toHaveBeenCalled()
  })

  it('calls exportCsv when CSV button is clicked', async () => {
    render(<Settings />)
    await waitFor(() => screen.getAllByText('CSV'))
    fireEvent.click(screen.getAllByText('CSV')[0])
    expect(window.api.exportCsv).toHaveBeenCalled()
  })

  it('calls createBackup when Backup button is clicked', async () => {
    render(<Settings />)
    await waitFor(() => screen.getAllByText('Backup'))
    fireEvent.click(screen.getAllByText('Backup')[0])
    expect(window.api.createBackup).toHaveBeenCalled()
  })

  it('renders about section', async () => {
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getAllByText("Rubik's Tracker").length).toBeGreaterThan(0)
    })
  })
})
