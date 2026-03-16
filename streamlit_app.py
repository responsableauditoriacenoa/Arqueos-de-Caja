import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title='Arqueos de Caja', layout='wide')

st.markdown(
    """
    <style>
    .block-container {padding: 0.5rem 0.75rem 0.75rem 0.75rem; max-width: 100% !important;}
    </style>
    """,
    unsafe_allow_html=True,
)

components.iframe(
    src='/static/index.html',
    height=980,
    scrolling=True,
)
