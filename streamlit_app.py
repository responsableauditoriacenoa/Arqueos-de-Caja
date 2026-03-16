import streamlit as st

st.set_page_config(page_title='Arqueos de Caja', layout='wide')

st.title('Arqueos de Caja')
st.caption('Acceso a la aplicación web')

st.link_button('Abrir aplicación', '/app/static/index.html#/', use_container_width=True)

st.info('Si el botón no abre automáticamente, copiá esta URL en el navegador: /app/static/index.html#/')
