#!/usr/bin/env python3

import argparse
from pathlib import Path
from statsuite_lib import KeycloakClient, TransferClient, NSIClient


OPENID_URL = 'https://keycloak-statsuite.dev.aws.fao.org/realms/statsuite/.well-known/openid-configuration'
KEYCLOAK_USER = 'test-admin'
KEYCLOAK_PASSWORD = 'admin'
TRANSFER_URL = 'https://transfer-statsuite.dev.aws.fao.org'
NSI_URL = 'https://nsi-design-statsuite.dev.aws.fao.org'
DATASPACE = 'design'


def process_xml_files(sample_data_dir, nsi):
    if not sample_data_dir.exists():
        raise FileNotFoundError(f"Directory {sample_data_dir} not found")

    for xml_file in sample_data_dir.rglob("*.xml"):
        print(f"Loading {str(xml_file):50} ", end='', flush=True)
        with open(xml_file, 'r', encoding='utf-8') as file:
            nsi.put(file_to_upload=file.read(), path='/rest/structure')
        print('✅')


def process_csv_files(sample_data_dir, transfer):
    if not sample_data_dir.exists():
        raise FileNotFoundError(f"Directory {sample_data_dir} not found")
    for csv_file in sample_data_dir.rglob("*.csv"):
        print(f"Loading {str(csv_file):50}")
        with open(csv_file, 'rb') as file:
            id = transfer.import_sdmx_file(file_object=file, dataspace=DATASPACE)
            print(f"Imported {id}")
    for zip_file in sample_data_dir.rglob("*.zip"):
        print(f"Loading {str(zip_file):50}")
        with open(zip_file, 'rb') as file:
            id = transfer.import_sdmx_file(file_object=file, dataspace=DATASPACE)
            print(f"Imported {id}")



def main():
    parser = argparse.ArgumentParser(description='Load sample data files to StatSuite')
    parser.add_argument('--sample-data-dir', required=True, help='Path to the sample data directory')
    
    args = parser.parse_args()
    
    # Convert string path to Path object
    sample_data_dir = Path(args.sample_data_dir)
    
    # Initialize clients
    keycloak = KeycloakClient(openid_url=OPENID_URL,
                              username=KEYCLOAK_USER,
                              password=KEYCLOAK_PASSWORD)

    transfer = TransferClient(transfer_url=TRANSFER_URL,
                              keycloak_client=keycloak)

    nsi = NSIClient(keycloak_client=keycloak, nsi_url=NSI_URL)
    
    # Process files
    process_xml_files(sample_data_dir, nsi)
    process_csv_files(sample_data_dir, transfer)


if __name__ == "__main__":
    main()
