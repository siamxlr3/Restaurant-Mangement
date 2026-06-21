import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarCollapsed: false,
  activeSection: 'dashboard',
  commandPaletteOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setActiveSection(state, action) {
      state.activeSection = action.payload
    },
    toggleCommandPalette(state) {
      state.commandPaletteOpen = !state.commandPaletteOpen
    },
  },
})

export const { toggleSidebar, setActiveSection, toggleCommandPalette } = uiSlice.actions
export default uiSlice.reducer
