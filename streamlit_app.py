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

components.html(
    """
    <iframe
      src="static/index.html"
      style="width:100%; height:92vh; border:none; border-radius:12px;"
      allow="clipboard-read; clipboard-write"
    ></iframe>
    """,
    height=980,
    scrolling=False,
)
