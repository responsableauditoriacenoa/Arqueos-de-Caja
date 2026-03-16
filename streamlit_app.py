import streamlit as st

st.set_page_config(page_title='Arqueos de Caja', layout='wide')

APP_URL = 'https://responsableauditoriacenoa.github.io/Arqueos-de-Caja/#/'

st.title('Arqueos de Caja')
st.caption('Acceso a la aplicación web')

st.link_button('Abrir aplicación', APP_URL, use_container_width=True)

st.info(f'Si el botón no abre automáticamente, copiá esta URL en el navegador: {APP_URL}')
